import { S3Client, ListObjectsV2Command} from "@aws-sdk/client-s3";
import { S3_CONFIG, THUMBNAIL_CONFIG } from "./config";
import { VideoMetadata, DirectoryMetadata } from "./types";

// S3 客户端配置
const s3Client = new S3Client({
  region: S3_CONFIG.region,
  endpoint: S3_CONFIG.endpoint,
  credentials: {
    accessKeyId: S3_CONFIG.accessKeyId,
    secretAccessKey: S3_CONFIG.secretAccessKey,
  },
  forcePathStyle: true, // 对于某些S3兼容服务，需要使用路径样式URL
});

const bucketName = S3_CONFIG.bucket;

// 从路径中提取作者名
const extractAuthorFromPath = (path: string): string => {
  // S3 视频文件的最后一个路径就是作者名
  const pathParts = path.split('/');
  if (pathParts.length > 1) {
    return pathParts[pathParts.length - 2]; // 返回文件所在的目录名，即作者名
  }
  
  return "Unknown";
};

// 从路径中提取视频标题
const extractTitleFromPath = (path: string): string => {
  // 直接获取文件名作为标题
  const filename = path.split('/').pop() || '';
  
  // 移除文件扩展名
  return filename.replace(/\.[^/.]+$/, "");
};

// 生成缩略图URL
const generateThumbnailUrl = (author: string, title: string): string => {
  // 修正URL格式为: https://cdn.jsdelivr.net/gh/Viper373/picx-images-hosting/作者名/视频标题.jpg
  return `${THUMBNAIL_CONFIG.imgCdn}/${THUMBNAIL_CONFIG.ghOwner}/${THUMBNAIL_CONFIG.ghRepo}/${author}/${title}.jpg`;
};

// 生成视频URL，不使用签名URL，直接使用自定义域名
const generateVideoUrl = (key: string): string => {
  // 将 s3.bitiful.net 替换为 bitiful.viper3.top，并且不添加桶名
  return `https://bitiful.viper3.top/${key}`;
};

// 使用缓存来存储目录和视频列表，避免重复请求
const directoryCache: Record<string, string[]> = {};
const videoCache: Record<string, VideoMetadata[]> = {};
const directoryMetadataCache: Record<string, DirectoryMetadata> = {};
let directoriesCache: string[] = []; // 修改为 let 而不是 const
const videosCache: Record<string, VideoMetadata[]> = {};

// 获取目录列表
export const fetchDirectories = async (): Promise<string[]> => {
  try {
    // 检查缓存
    if (directoriesCache.length > 0) {
      return directoriesCache;
    }

    // 创建一个集合来存储唯一的目录路径
    const uniqueDirectories = new Set<string>();
    let continuationToken: string | undefined = undefined;
    
    // 使用 XOVideos/ 作为基础前缀
    const basePrefix = "XOVideos/";
    
    // 使用分页获取所有对象
    do {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: basePrefix,
        Delimiter: "/",
        MaxKeys: 10000, // 增加到最大值10000
        ContinuationToken: continuationToken
      });
      
      const response = await s3Client.send(command);
      
      // 添加基础目录
      uniqueDirectories.add("XOVideos");
      
      // 处理公共前缀（目录）
      if (response.CommonPrefixes && response.CommonPrefixes.length > 0) {
        for (const prefix of response.CommonPrefixes) {
          if (prefix.Prefix) {
            // 移除末尾的斜杠
            const dirPath = prefix.Prefix.replace(/\/$/, "");
            uniqueDirectories.add(dirPath);
            
            // 递归获取子目录
            await fetchSubDirectories(dirPath, uniqueDirectories);
          }
        }
      }
      
      // 更新令牌以获取下一页
      continuationToken = response.NextContinuationToken as string | undefined;
    } while (continuationToken);
    
    // 将集合转换为数组并排序
    const directories = Array.from(uniqueDirectories).sort();
    
    // 更新缓存
    directoriesCache = directories;
    
    return directories;
  } catch (error) {
    return [];
  }
};

// 递归获取子目录
const fetchSubDirectories = async (parentPath: string, uniqueDirectories: Set<string>): Promise<void> => {
  try {
    let continuationToken: string | undefined = undefined;
    
    do {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `${parentPath}/`,
        Delimiter: "/",
        MaxKeys: 10000, // 增加到最大值10000
        ContinuationToken: continuationToken
      });
      
      const response = await s3Client.send(command);
      
      // 处理公共前缀（子目录）
      if (response.CommonPrefixes && response.CommonPrefixes.length > 0) {
        for (const prefix of response.CommonPrefixes) {
          if (prefix.Prefix) {
            // 移除末尾的斜杠
            const dirPath = prefix.Prefix.replace(/\/$/, "");
            uniqueDirectories.add(dirPath);
            
            // 递归获取更深层次的子目录
            await fetchSubDirectories(dirPath, uniqueDirectories);
          }
        }
      }
      
      // 更新令牌以获取下一页
      continuationToken = response.NextContinuationToken as string | undefined;
    } while (continuationToken);
  } catch (error) {
    // 忽略错误，继续处理其他目录
  }
};

// 获取目录元数据（视频数量和最近更新时间）
export const fetchDirectoryMetadata = async (directoryPath: string): Promise<DirectoryMetadata> => {
  try {
    // 检查缓存
    if (directoryMetadataCache[directoryPath]) {
      return directoryMetadataCache[directoryPath];
    }
    
    // 确保视频扩展名都是小写
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    let videoCount = 0;
    let lastUpdated: Date | null = null;
    let continuationToken: string | undefined = undefined;
    
    // 准备前缀，确保正确处理根目录和子目录
    let prefix = "";
    if (directoryPath === "XOVideos") {
      prefix = "XOVideos/";
    } else if (directoryPath.startsWith("XOVideos/")) {
      prefix = directoryPath.endsWith('/') ? directoryPath : `${directoryPath}/`;
    } else {
      prefix = `XOVideos/${directoryPath}/`;
    }
    
    // 使用分页获取所有对象
    do {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: 10000, // 增加到最大值10000
        ContinuationToken: continuationToken
      });

      const response = await s3Client.send(command);
      
      if (response.Contents && response.Contents.length > 0) {
        for (const item of response.Contents) {
          // 跳过目录本身
          if (!item.Key || item.Key === prefix) continue;
          
          // 检查是否为视频文件
          const key = item.Key;
          
          // 对于上级目录，我们需要计算所有子目录中的视频
          const isVideo = videoExtensions.some(ext => key.toLowerCase().endsWith(ext));
          
          if (isVideo) {
            videoCount++;
            
            // 更新最近修改时间
            if (item.LastModified && (!lastUpdated || item.LastModified > lastUpdated)) {
              lastUpdated = item.LastModified;
            }
          }
        }
        
      }
      
      // 更新令牌以获取下一页
      continuationToken = response.NextContinuationToken as string | undefined;
    } while (continuationToken);

    // 从路径中提取目录名
    const name = directoryPath.split('/').pop() || directoryPath;

    const metadata: DirectoryMetadata = {
      name,
      path: directoryPath,
      videoCount,
      lastUpdated: lastUpdated ? lastUpdated.toISOString().split('T')[0] : '未知'
    };
    
    // 缓存结果
    directoryMetadataCache[directoryPath] = metadata;
    return metadata;
  } catch (error) {
    // 从路径中提取目录名
    const name = directoryPath.split('/').pop() || directoryPath;
    
    return {
      name,
      path: directoryPath,
      videoCount: 0,
      lastUpdated: '未知'
    };
  }
};

// 获取视频列表
export const fetchVideos = async (directoryPath: string = ""): Promise<VideoMetadata[]> => {
  try {
    // 检查缓存
    const cacheKey = directoryPath || "root";
    if (videosCache[cacheKey]) {
      return videosCache[cacheKey];
    }

    // 构建前缀
    const prefix = directoryPath ? 
      (directoryPath.endsWith("/") ? directoryPath : `${directoryPath}/`) : 
      "";
    
    const videos: VideoMetadata[] = [];
    const metadataPromises: Promise<void>[] = [];
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    let continuationToken: string | undefined = undefined;
    
    // 使用分页获取所有对象
    do {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: 10000, // 增加到最大值10000
        ContinuationToken: continuationToken
      });

      const response = await s3Client.send(command);
      
      if (response.Contents) {
        for (const item of response.Contents) {
          if (!item.Key) continue;
          
          // 检查是否为视频文件
          if (videoExtensions.some(ext => item.Key!.toLowerCase().endsWith(ext))) {
            const key = item.Key;
            
            // 从路径中提取作者和标题
            const author = extractAuthorFromPath(key);
            const title = extractTitleFromPath(key);
            
            // 创建视频对象
            const video: VideoMetadata = {
              id: key,
              title,
              author,
              duration: "加载中...",
              views: 0,
              thumbnailUrl: generateThumbnailUrl(author, title),
              videoUrl: generateVideoUrl(key),
              lastModified: item.LastModified,
              size: item.Size
            };
            
            // 添加到视频列表
            videos.push(video);
            
            // 异步获取视频元数据
            const metadataPromise = fetchVideoMetadata(title, author).then(metadata => {
              if (metadata) {
                // 更新视频对象的元数据
                video.duration = metadata.duration || "00:00";
                video.views = metadata.views || 0;
              }
            }).catch(error => {
              // 设置默认值
              video.duration = "00:00";
              video.views = 0;
            });
            
            metadataPromises.push(metadataPromise);
          }
        }
      }
      
      // 更新令牌以获取下一页
      continuationToken = response.NextContinuationToken as string | undefined;
    } while (continuationToken);
    
    // 等待所有元数据请求完成
    await Promise.all(metadataPromises);
    
    // 更新缓存
    videosCache[cacheKey] = videos;
    
    return videos;
  } catch (error) {
    return [];
  }
};

// 获取视频元数据（时长和观看次数）
export const fetchVideoMetadata = async (title: string, author: string): Promise<{ duration: string; views: number }> => {
  try {
    // 根据环境选择正确的 API URL
    let apiUrl = '';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // 本地开发环境
      apiUrl = `http://127.0.0.1:8000/api/xovideos?author=${encodeURIComponent(author)}`;
    } else {
      // 生产环境
      apiUrl = `/api/xovideos?author=${encodeURIComponent(author)}`;
    }
    
    // 尝试从API获取元数据
    try {
      // 简化fetch请求
      const response = await fetch(apiUrl);
      
      // 如果请求成功，解析JSON数据
      if (response.ok) {
        const responseData = await response.json();
        
        if (responseData.status === "success" && Array.isArray(responseData.data)) {
          // 在返回的数据中查找匹配的视频
          const videoData = responseData.data.find(
            (item: any) => item.video_title === title || item.video_title === title.replace(/\.[^/.]+$/, "")
          );
          
          if (videoData) {
            return {
              duration: videoData.duration,
              views: videoData.video_views
            };
          } else {
            // 返回默认值
            return {
              duration: "00:00",
              views: 0
            };
          }
        } else {
          return {
            duration: "00:00",
            views: 0
          };
        }
      } else {
        // 返回默认值，而不是抛出错误
        return {
          duration: "00:00",
          views: 0
        };
      }
    } catch (error) {
      // 返回默认值
      return {
        duration: "00:00",
        views: 0
      };
    }
  } catch (error) {
    // 返回默认值
    return {
      duration: "00:00",
      views: 0
    };
  }
};
